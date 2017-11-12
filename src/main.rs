#![feature(plugin)]
#![plugin(rocket_codegen)]

extern crate rocket;

use std::path::{Path, PathBuf};
use rocket::response::NamedFile;


#[get("/")]
fn index() -> Option<NamedFile> {
    NamedFile::open("static/index.html").ok()
}


#[get("/static/<file..>")]
fn static_files(file: PathBuf) -> Option<NamedFile> {
    let path = Path::new("static/").join(file);

    NamedFile::open(path).ok()
}


fn main() {
    let mut app = rocket::ignite();
    app = app.mount("/", routes![index]);
    app = app.mount("/", routes![static_files]);
    app.launch();
}
