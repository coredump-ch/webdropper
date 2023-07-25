use std::{borrow::Cow, net::SocketAddr, path::PathBuf, process, sync::Arc};

use axum::{
    body::{boxed, Bytes, Full},
    extract::{DefaultBodyLimit, Extension, Multipart},
    http::{header, Response},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use clap::Parser;
use rust_embed::RustEmbed;
use tracing::{error, info};

#[derive(Parser)]
struct Args {
    /// Path to the directory where files will be put.
    #[clap(short, long)]
    target_dir: PathBuf,

    /// Address to bind to
    #[clap(short, long, default_value = "127.0.0.1:3000")]
    bind: SocketAddr,
}

#[derive(RustEmbed)]
#[folder = "public/"]
struct EmbeddableStaticFile;

#[tokio::main]
async fn main() {
    // Set the RUST_LOG, if it hasn't been explicitly defined
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "webdropper=debug,tower_http=info")
    }
    tracing_subscriber::fmt::init();

    // Parse args
    let args = Args::parse();
    if !args.target_dir.exists() {
        eprintln!("Error: Target dir {:?} does not exist", args.target_dir);
        process::exit(1);
    }
    if !args.target_dir.is_dir() {
        eprintln!("Error: Path {:?} is not a directory", args.target_dir);
        process::exit(1);
    }
    let args = Arc::new(args);

    // Build our application with some routes
    let app = app(args.clone());

    // run it with hyper
    tracing::info!("Listening on {}", &args.bind);
    axum::Server::bind(&args.bind)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

fn app(args: Arc<Args>) -> Router {
    Router::new()
        .route("/", get(index).post(accept_form))
        .route("/scripts.js", get(scripts))
        .layer(Extension(args))
        .layer(DefaultBodyLimit::max(250 * 1024 * 1024)) // 250MB limit
        .layer(tower_http::trace::TraceLayer::new_for_http())
}

type IndexReturnType = Html<Cow<'static, [u8]>>;

/// Helper function to show the index page
fn show_index(success_msg: Option<&str>) -> IndexReturnType {
    let raw_bytes = EmbeddableStaticFile::get("index.html").unwrap().data;
    match success_msg {
        Some(msg) => {
            // Add success message to HTML by replacing placeholder comment
            let template_html = std::str::from_utf8(&raw_bytes).expect("Non-UTF8 index.html");
            let message_html = format!(
                "<p class='success'>{}<p>",
                html_escape::encode_safe(msg).replace('\n', "<br>")
            );
            let bytes = template_html
                .replace("<!--success-msg-->", &message_html)
                .as_bytes()
                .to_vec();
            Html(Cow::Owned(bytes))
        }
        None => {
            // Return raw HTML
            Html(raw_bytes)
        }
    }
}

async fn index() -> IndexReturnType {
    show_index(None)
}

async fn scripts() -> impl IntoResponse {
    let data = EmbeddableStaticFile::get("scripts.js").unwrap().data;
    let body = boxed(Full::from(data));
    Response::builder()
        .header(header::CONTENT_TYPE, "application/javascript")
        .body(body)
        .unwrap()
}

async fn store_file(filename: &str, bytes: Bytes, args: &Args) -> std::io::Result<()> {
    info!(
        "Store file with filename {:?} and {} bytes to dir {:?}",
        filename,
        bytes.len(),
        &args.target_dir
    );
    tokio::fs::write(args.target_dir.join(filename), bytes).await?;
    Ok(())
}

async fn accept_form(
    Extension(args): Extension<Arc<Args>>,
    mut multipart: Multipart,
) -> IndexReturnType {
    // Store all files in the multipart body in the file system
    let mut uploaded_files: Vec<(String, usize)> = vec![];
    while let Some(field) = multipart.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap().to_string();
        let file_bytes = field.bytes().await.expect("Could not read file bytes");
        uploaded_files.push((file_name.clone(), file_bytes.len()));
        if let Err(e) = store_file(&file_name, file_bytes, &args).await {
            error!("Failed to upload file {}: {:?}", file_name, e);
        }
    }

    // Build success message
    let mut msg = format!("Successfully uploaded {} file(s):", uploaded_files.len());
    for (name, bytes) in uploaded_files {
        msg.push('\n');
        msg.push_str(&name);
        msg.push_str(&format!(" ({} bytes)", bytes));
    }

    // Show index page
    show_index(Some(&msg))
}
