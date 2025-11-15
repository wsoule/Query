use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConnectionConfig {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub password: String,
}
