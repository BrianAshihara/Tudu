mod commands;
mod db;
mod error;
mod models;

use std::sync::Mutex;

use tauri::Manager;

use commands::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let conn = db::open(&dir.join("tudu.db"))?;
            app.manage(Database(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_tasks,
            commands::create_task,
            commands::update_task,
            commands::move_task,
            commands::delete_task,
            commands::set_task_tags,
            commands::list_tags,
            commands::create_tag,
            commands::update_tag,
            commands::delete_tag,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
