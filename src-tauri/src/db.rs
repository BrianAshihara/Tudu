use std::collections::HashMap;
use std::path::Path;

use rusqlite::{params, Connection, ErrorCode, OptionalExtension, Row};

use crate::error::{Error, Result};
use crate::models::{NewTask, Status, Tag, TagInput, Task, TaskPatch};

const NOW: &str = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

const TAG_COLORS: &[&str] = &["red", "orange", "yellow", "green", "blue", "purple", "gray"];

const MIGRATIONS: &[&str] = &[r#"
CREATE TABLE tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT    NOT NULL,
    description  TEXT    NOT NULL DEFAULT '',
    status       TEXT    NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    position     REAL    NOT NULL DEFAULT 0,
    created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    completed_at TEXT
);

CREATE INDEX idx_tasks_status_position ON tasks (status, position);

CREATE TABLE tags (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL DEFAULT 'gray'
);

CREATE TABLE task_tags (
    task_id INTEGER NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);
"#];

const TASK_COLUMNS: &str =
    "id, title, description, status, position, created_at, updated_at, completed_at";

pub fn open(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.pragma_update_and_check(None, "journal_mode", "WAL", |_| Ok(()))?;
    init(&conn)?;
    Ok(conn)
}

pub fn init(conn: &Connection) -> Result<()> {
    conn.pragma_update(None, "foreign_keys", "ON")?;
    let version: i64 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    for (index, sql) in MIGRATIONS.iter().enumerate().skip(version as usize) {
        conn.execute_batch(sql)?;
        conn.pragma_update(None, "user_version", (index + 1) as i64)?;
    }
    Ok(())
}

fn map_task(row: &Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get(0)?,
        title: row.get(1)?,
        description: row.get(2)?,
        status: row.get(3)?,
        position: row.get(4)?,
        tag_ids: Vec::new(),
        created_at: row.get(5)?,
        updated_at: row.get(6)?,
        completed_at: row.get(7)?,
    })
}

fn map_tag(row: &Row) -> rusqlite::Result<Tag> {
    Ok(Tag {
        id: row.get(0)?,
        name: row.get(1)?,
        color: row.get(2)?,
    })
}

fn clean_title(title: &str) -> Result<String> {
    let title = title.trim();
    if title.is_empty() {
        return Err(Error::Validation("Title cannot be empty".into()));
    }
    Ok(title.to_string())
}

fn clean_tag(input: &TagInput) -> Result<(String, String)> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err(Error::Validation("Tag name cannot be empty".into()));
    }
    if !TAG_COLORS.contains(&input.color.as_str()) {
        return Err(Error::Validation(format!("Invalid tag color: {}", input.color)));
    }
    Ok((name.to_string(), input.color.clone()))
}

fn map_unique(err: rusqlite::Error, message: &str) -> Error {
    match err.sqlite_error_code() {
        Some(ErrorCode::ConstraintViolation) => Error::Validation(message.into()),
        _ => Error::Db(err),
    }
}

fn next_position(conn: &Connection, status: Status) -> Result<f64> {
    Ok(conn.query_row(
        "SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE status = ?1",
        [status],
        |row| row.get(0),
    )?)
}

fn write_task_tags(conn: &Connection, task_id: i64, tag_ids: &[i64]) -> Result<()> {
    conn.execute("DELETE FROM task_tags WHERE task_id = ?1", [task_id])?;
    let mut stmt =
        conn.prepare("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1, ?2)")?;
    for tag_id in tag_ids {
        stmt.execute([task_id, *tag_id])?;
    }
    Ok(())
}

pub fn list_tasks(conn: &Connection) -> Result<Vec<Task>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT {TASK_COLUMNS} FROM tasks ORDER BY position, id"
    ))?;
    let mut tasks = stmt
        .query_map([], map_task)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let mut stmt = conn.prepare("SELECT task_id, tag_id FROM task_tags ORDER BY tag_id")?;
    let pairs = stmt.query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?)))?;
    let mut by_task: HashMap<i64, Vec<i64>> = HashMap::new();
    for pair in pairs {
        let (task_id, tag_id) = pair?;
        by_task.entry(task_id).or_default().push(tag_id);
    }
    for task in &mut tasks {
        if let Some(ids) = by_task.remove(&task.id) {
            task.tag_ids = ids;
        }
    }
    Ok(tasks)
}

pub fn get_task(conn: &Connection, id: i64) -> Result<Task> {
    let mut task = conn
        .query_row(
            &format!("SELECT {TASK_COLUMNS} FROM tasks WHERE id = ?1"),
            [id],
            map_task,
        )
        .optional()?
        .ok_or(Error::NotFound)?;
    let mut stmt =
        conn.prepare("SELECT tag_id FROM task_tags WHERE task_id = ?1 ORDER BY tag_id")?;
    task.tag_ids = stmt
        .query_map([id], |row| row.get(0))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(task)
}

pub fn create_task(conn: &mut Connection, input: NewTask) -> Result<Task> {
    let title = clean_title(&input.title)?;
    let status = input.status.unwrap_or(Status::Todo);
    let description = input.description.unwrap_or_default();

    let tx = conn.transaction()?;
    let position = next_position(&tx, status)?;
    tx.execute(
        &format!(
            "INSERT INTO tasks (title, description, status, position, completed_at)
             VALUES (?1, ?2, ?3, ?4, CASE WHEN ?3 = 'done' THEN {NOW} END)"
        ),
        params![title, description, status, position],
    )?;
    let id = tx.last_insert_rowid();
    if let Some(tag_ids) = input.tag_ids {
        write_task_tags(&tx, id, &tag_ids)?;
    }
    tx.commit()?;
    get_task(conn, id)
}

pub fn update_task(conn: &Connection, id: i64, patch: TaskPatch) -> Result<Task> {
    let current = get_task(conn, id)?;
    let title = match patch.title {
        Some(title) => clean_title(&title)?,
        None => current.title,
    };
    let description = patch.description.unwrap_or(current.description);
    let (status, position) = match patch.status {
        Some(status) if status != current.status => (status, next_position(conn, status)?),
        _ => (current.status, current.position),
    };

    conn.execute(
        &format!(
            "UPDATE tasks
             SET title = ?1, description = ?2, status = ?3, position = ?4, updated_at = {NOW},
                 completed_at = CASE WHEN ?3 = 'done' THEN COALESCE(completed_at, {NOW}) END
             WHERE id = ?5"
        ),
        params![title, description, status, position, id],
    )?;
    get_task(conn, id)
}

pub fn move_task(conn: &Connection, id: i64, status: Status, position: f64) -> Result<Task> {
    let changed = conn.execute(
        &format!(
            "UPDATE tasks
             SET status = ?1, position = ?2, updated_at = {NOW},
                 completed_at = CASE WHEN ?1 = 'done' THEN COALESCE(completed_at, {NOW}) END
             WHERE id = ?3"
        ),
        params![status, position, id],
    )?;
    if changed == 0 {
        return Err(Error::NotFound);
    }
    get_task(conn, id)
}

pub fn delete_task(conn: &Connection, id: i64) -> Result<()> {
    if conn.execute("DELETE FROM tasks WHERE id = ?1", [id])? == 0 {
        return Err(Error::NotFound);
    }
    Ok(())
}

pub fn set_task_tags(conn: &mut Connection, task_id: i64, tag_ids: &[i64]) -> Result<Task> {
    let tx = conn.transaction()?;
    let changed = tx.execute(
        &format!("UPDATE tasks SET updated_at = {NOW} WHERE id = ?1"),
        [task_id],
    )?;
    if changed == 0 {
        return Err(Error::NotFound);
    }
    write_task_tags(&tx, task_id, tag_ids)?;
    tx.commit()?;
    get_task(conn, task_id)
}

pub fn list_tags(conn: &Connection) -> Result<Vec<Tag>> {
    let mut stmt = conn.prepare("SELECT id, name, color FROM tags ORDER BY name COLLATE NOCASE")?;
    let tags = stmt
        .query_map([], map_tag)?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(tags)
}

fn get_tag(conn: &Connection, id: i64) -> Result<Tag> {
    conn.query_row("SELECT id, name, color FROM tags WHERE id = ?1", [id], map_tag)
        .optional()?
        .ok_or(Error::NotFound)
}

pub fn create_tag(conn: &Connection, input: TagInput) -> Result<Tag> {
    let (name, color) = clean_tag(&input)?;
    conn.execute(
        "INSERT INTO tags (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .map_err(|err| map_unique(err, "A tag with this name already exists"))?;
    get_tag(conn, conn.last_insert_rowid())
}

pub fn update_tag(conn: &Connection, id: i64, input: TagInput) -> Result<Tag> {
    let (name, color) = clean_tag(&input)?;
    let changed = conn
        .execute(
            "UPDATE tags SET name = ?1, color = ?2 WHERE id = ?3",
            params![name, color, id],
        )
        .map_err(|err| map_unique(err, "A tag with this name already exists"))?;
    if changed == 0 {
        return Err(Error::NotFound);
    }
    get_tag(conn, id)
}

pub fn delete_tag(conn: &Connection, id: i64) -> Result<()> {
    if conn.execute("DELETE FROM tags WHERE id = ?1", [id])? == 0 {
        return Err(Error::NotFound);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        init(&conn).unwrap();
        conn
    }

    fn new_task(title: &str) -> NewTask {
        NewTask {
            title: title.into(),
            description: None,
            status: None,
            tag_ids: None,
        }
    }

    fn tag(name: &str, color: &str) -> TagInput {
        TagInput {
            name: name.into(),
            color: color.into(),
        }
    }

    #[test]
    fn creates_tasks_at_the_end_of_their_column() {
        let mut conn = setup();
        let first = create_task(&mut conn, new_task("First")).unwrap();
        let second = create_task(&mut conn, new_task("Second")).unwrap();
        assert_eq!(first.status, Status::Todo);
        assert!(second.position > first.position);
    }

    #[test]
    fn rejects_empty_titles() {
        let mut conn = setup();
        assert!(matches!(
            create_task(&mut conn, new_task("   ")),
            Err(Error::Validation(_))
        ));
    }

    #[test]
    fn tracks_completion_date() {
        let mut conn = setup();
        let task = create_task(&mut conn, new_task("Task")).unwrap();
        assert!(task.completed_at.is_none());

        let patch = TaskPatch {
            status: Some(Status::Done),
            ..Default::default()
        };
        let done = update_task(&conn, task.id, patch).unwrap();
        assert!(done.completed_at.is_some());

        let reopened = move_task(&conn, task.id, Status::InProgress, 1.0).unwrap();
        assert!(reopened.completed_at.is_none());
    }

    #[test]
    fn tags_are_removed_with_their_task() {
        let mut conn = setup();
        let home = create_tag(&conn, tag("Home", "blue")).unwrap();
        let task = create_task(&mut conn, new_task("Task")).unwrap();

        let tagged = set_task_tags(&mut conn, task.id, &[home.id]).unwrap();
        assert_eq!(tagged.tag_ids, vec![home.id]);

        delete_task(&conn, task.id).unwrap();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM task_tags", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn rejects_duplicate_tag_names() {
        let conn = setup();
        create_tag(&conn, tag("Work", "red")).unwrap();
        assert!(matches!(
            create_tag(&conn, tag("work", "blue")),
            Err(Error::Validation(_))
        ));
    }
}
