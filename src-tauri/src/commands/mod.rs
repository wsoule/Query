mod connection;
mod history;
mod saved_queries;
mod settings;

pub use connection::{execute_query, get_database_schema, test_postgres_connection};
pub use history::{clear_query_history, get_query_history, save_query_to_history};
pub use saved_queries::{delete_saved_query, get_saved_queries, save_query, toggle_pin_query};
pub use settings::{
    delete_connection_password, get_app_dir, get_connection_password, get_current_project_path,
    load_connections, load_project_settings, save_connection_password, save_connections,
    set_project_path,
};
