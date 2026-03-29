import { defineType, defineField } from "sanity";

export const resource = defineType({
  name: "resource",
  title: "Risorsa",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Titolo",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "language",
      title: "Lingua",
      type: "string",
      options: {
        list: [
          { title: "Italiano", value: "it" },
          { title: "English", value: "en" },
        ],
        layout: "radio",
      },
      initialValue: "it",
    }),
    defineField({
      name: "contentType",
      title: "Tipo",
      type: "string",
      options: {
        list: [
          { title: "Esercizi", value: "esercizi" },
          { title: "Guida", value: "guida" },
          { title: "Scheda", value: "scheda" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "topic",
      title: "Argomento",
      type: "reference",
      to: [{ type: "topic" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Descrizione",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "file",
      title: "File",
      type: "file",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Data di pubblicazione",
      type: "datetime",
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: "title", contentType: "contentType", language: "language" },
    prepare({ title, contentType, language }) {
      return {
        title,
        subtitle: `${contentType || ""} — ${language?.toUpperCase() || ""}`,
      };
    },
  },
});
