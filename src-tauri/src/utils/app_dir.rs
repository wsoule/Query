use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

// Global state for current project path
pub static PROJECT_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);

pub fn get_app_dir() -> Result<PathBuf, String> {
    // Check if custom project path is set
    let project_path = PROJECT_PATH.lock().unwrap();

    let app_dir = if let Some(path) = project_path.as_ref() {
        path.clone()
    } else {
        dirs::home_dir()
            .ok_or("Could not find home directory")?
            .join(".query")
    };

    fs::create_dir_all(&app_dir).map_err(|e| format!("Could not create app directory: {}", e))?;

    Ok(app_dir)
}

pub fn set_project_path_internal(path: String) -> Result<(), String> {
    let project_path = PathBuf::from(path);

    // Verify directory exists or can be created
    fs::create_dir_all(&project_path)
        .map_err(|e| format!("Could not create project directory: {}", e))?;

    // Set the global project path
    let mut current_path = PROJECT_PATH.lock().unwrap();
    *current_path = Some(project_path.clone());

    // Save to a settings file in the default location for persistence
    let default_dir = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".query");
    fs::create_dir_all(&default_dir)
        .map_err(|e| format!("Could not create default directory: {}", e))?;

    let settings_file = default_dir.join("settings.json");
    let settings = serde_json::json!({
        "project_path": project_path.to_string_lossy().to_string()
    });
    fs::write(
        settings_file,
        serde_json::to_string_pretty(&settings).unwrap(),
    )
    .map_err(|e| format!("Could not write settings: {}", e))?;

    Ok(())
}

pub fn get_current_project_path_internal() -> Result<Option<String>, String> {
    let project_path = PROJECT_PATH.lock().unwrap();
    Ok(project_path
        .as_ref()
        .map(|p| p.to_string_lossy().to_string()))
}

pub fn load_project_settings_internal() -> Result<(), String> {
    let default_dir = dirs::home_dir()
        .ok_or("Could not find home directory")?
        .join(".query");

    let settings_file = default_dir.join("settings.json");

    if settings_file.exists() {
        let data = fs::read_to_string(&settings_file)
            .map_err(|e| format!("Failed to read settings: {}", e))?;

        let settings: serde_json::Value =
            serde_json::from_str(&data).map_err(|e| format!("Failed to parse settings: {}", e))?;

        if let Some(path_str) = settings.get("project_path").and_then(|v| v.as_str()) {
            let mut current_path = PROJECT_PATH.lock().unwrap();
            *current_path = Some(PathBuf::from(path_str));
        }
    }

    Ok(())
}
