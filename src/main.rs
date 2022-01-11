use std::{borrow::Cow, net::SocketAddr};

use axum::{
    body::{boxed, Full},
    extract::{ContentLengthLimit, Multipart},
    http::{header, Response},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "public/"]
struct EmbeddableStaticFile;

#[tokio::main]
async fn main() {
    // Set the RUST_LOG, if it hasn't been explicitly defined
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "webdropper=debug,tower_http=debug")
    }
    tracing_subscriber::fmt::init();

    // build our application with some routes
    let app = Router::new()
        .route("/", get(index).post(accept_form))
        .route("/scripts.js", get(scripts))
        .layer(tower_http::trace::TraceLayer::new_for_http());

    // run it with hyper
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("listening on {}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn index() -> Html<Cow<'static, [u8]>> {
    Html(EmbeddableStaticFile::get("index.html").unwrap().data)
}

async fn scripts() -> impl IntoResponse {
    let data = EmbeddableStaticFile::get("scripts.js").unwrap().data;
    let body = boxed(Full::from(data));
    Response::builder()
        .header(header::CONTENT_TYPE, "application/javascript")
        .body(body)
        .unwrap()
}

type LimitedMultipart = ContentLengthLimit<
    Multipart,
    {
        250 * 1024 * 1024 /* 250mb */
    },
>;

async fn accept_form(ContentLengthLimit(mut multipart): LimitedMultipart) {
    while let Some(field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        let data = field.bytes().await.unwrap();

        println!("Length of `{}` is {} bytes", name, data.len());
    }
}
