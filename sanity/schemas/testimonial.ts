import { defineType, defineField } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Recensione",
  type: "document",
  fields: [
    defineField({
      name: "text",
      title: "Testo",
      type: "object",
      fields: [
        { name: "it", title: "Italiano", type: "text", rows: 4, validation: (r) => r.required() },
        { name: "en", title: "English", type: "text", rows: 4 },
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "Autore",
      type: "string",
      description: "Es. \"M., 34 anni\"",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "rating",
      title: "Valutazione",
      type: "number",
      validation: (r) => r.required().min(1).max(5),
      options: { list: [1, 2, 3, 4, 5] },
    }),
    defineField({
      name: "featured",
      title: "In evidenza (homepage)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "source",
      title: "Fonte",
      type: "string",
      options: {
        list: [
          { title: "Manuale", value: "manual" },
          { title: "Google", value: "google" },
        ],
        layout: "radio",
      },
      initialValue: "manual",
    }),
    defineField({
      name: "order",
      title: "Ordine (homepage)",
      type: "number",
      description: "Ordine di visualizzazione per le recensioni in evidenza",
    }),
    defineField({
      name: "publishedAt",
      title: "Data",
      type: "datetime",
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    {
      title: "Data",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { text: "text.it", author: "author", rating: "rating" },
    prepare({ text, author, rating }) {
      const stars = "★".repeat(rating || 0) + "☆".repeat(5 - (rating || 0));
      return {
        title: text ? `${text.substring(0, 60)}...` : "Nuova recensione",
        subtitle: `${stars} — ${author || ""}`,
      };
    },
  },
});
