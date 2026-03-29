import { defineType, defineField } from "sanity";

export const post = defineType({
  name: "post",
  title: "Articolo",
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: "translationOf",
      title: "Traduzione di",
      type: "reference",
      to: [{ type: "post" }],
      description: "Collegamento alla versione nell'altra lingua",
    }),
    defineField({
      name: "topic",
      title: "Argomento",
      type: "reference",
      to: [{ type: "topic" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "author",
      title: "Autore",
      type: "string",
      initialValue: "Ida Sato",
    }),
    defineField({
      name: "publishedAt",
      title: "Data di pubblicazione",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Estratto",
      type: "text",
      rows: 3,
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: "body",
      title: "Contenuto",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  { name: "href", type: "url", title: "URL" },
                ],
              },
            ],
          },
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", type: "string", title: "Alt text" },
          ],
        },
      ],
    }),
  ],
  orderings: [
    {
      title: "Data di pubblicazione",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: { title: "title", language: "language", date: "publishedAt" },
    prepare({ title, language, date }) {
      return {
        title,
        subtitle: `${language?.toUpperCase() || ""} — ${date ? new Date(date).toLocaleDateString() : ""}`,
      };
    },
  },
});
