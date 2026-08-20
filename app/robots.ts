import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogue", "/catalogue/", "/discover", "/binder", "/sets"],
        disallow: [
          "/admin/",
          "/dashboard",
          "/profile",
          "/collection",
          "/cart",
          "/checkout/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/missing-cards",
          "/api/",
        ],
      },
    ],
    sitemap: "https://collectra.com/sitemap.xml",
  };
}
