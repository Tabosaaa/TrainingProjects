package main

//Next class: Tailwind CSS

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/tabosaaa/go-course/controllers"
	"github.com/tabosaaa/go-course/templates"
	"github.com/tabosaaa/go-course/views"
)

func main() {
	r := chi.NewRouter()
	r.Get("/", controllers.StaticHandler(views.Must(views.ParseFS(
		templates.FS,
		"home.gohtml", "tailwind.gohtml",
	))))

	r.Get("/contact", controllers.StaticHandler(views.Must(
		views.ParseFS(templates.FS, "contact.gohtml", "tailwind.gohtml"))))

	r.Get("/faq", controllers.FAQ(
		views.Must(views.ParseFS(templates.FS, "faq.gohtml", "tailwind.gohtml"))))

	r.Get("/signup", controllers.StaticHandler(views.Must(views.ParseFS(
		templates.FS,
		"signup.gohtml", "tailwind.gohtml",
	))))

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "Page not found", http.StatusNotFound)
	})

	log.Println("listening on localhost:3000")
	log.Fatal(http.ListenAndServe(":3000", r))
}
