use std::sync::{Mutex, MutexGuard};

use rusqlite::Connection;
use tauri::State;

use crate::db;
use crate::error::{Error, Result};
use crate::models::{NewTask, Status, Tag, TagInput, Task, TaskPatch};

pub struct Database(pub Mutex<Connection>);

impl Database {
    fn conn(&self) -> Result<MutexGuard<'_, Connection>> {
        self.0.lock().map_err(|_| Error::Lock)
    }
}

#[tauri::command]
pub fn list_tasks(db: State<'_, Database>) -> Result<Vec<Task>> {
    db::list_tasks(&*db.conn()?)
}

#[tauri::command]
pub fn create_task(db: State<'_, Database>, input: NewTask) -> Result<Task> {
    db::create_task(&mut *db.conn()?, input)
}

#[tauri::command]
pub fn update_task(db: State<'_, Database>, id: i64, patch: TaskPatch) -> Result<Task> {
    db::update_task(&*db.conn()?, id, patch)
}

#[tauri::command]
pub fn move_task(db: State<'_, Database>, id: i64, status: Status, position: f64) -> Result<Task> {
    db::move_task(&*db.conn()?, id, status, position)
}

#[tauri::command]
pub fn delete_task(db: State<'_, Database>, id: i64) -> Result<()> {
    db::delete_task(&*db.conn()?, id)
}

#[tauri::command]
pub fn delete_tasks(db: State<'_, Database>, ids: Vec<i64>) -> Result<usize> {
    db::delete_tasks(&mut *db.conn()?, &ids)
}

#[tauri::command]
pub fn set_task_tags(db: State<'_, Database>, task_id: i64, tag_ids: Vec<i64>) -> Result<Task> {
    db::set_task_tags(&mut *db.conn()?, task_id, &tag_ids)
}

#[tauri::command]
pub fn list_tags(db: State<'_, Database>) -> Result<Vec<Tag>> {
    db::list_tags(&*db.conn()?)
}

#[tauri::command]
pub fn create_tag(db: State<'_, Database>, input: TagInput) -> Result<Tag> {
    db::create_tag(&*db.conn()?, input)
}

#[tauri::command]
pub fn update_tag(db: State<'_, Database>, id: i64, input: TagInput) -> Result<Tag> {
    db::update_tag(&*db.conn()?, id, input)
}

#[tauri::command]
pub fn delete_tag(db: State<'_, Database>, id: i64) -> Result<()> {
    db::delete_tag(&*db.conn()?, id)
}
