import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogue", "/discover"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/profile/",
          "/collection/",
          "/cart/",
          "/checkout/",
          "/login/",
          "/register/",
          "/forgot-password/",
          "/reset-password/",
          "/missing-cards/",
          "/binder/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://collectrauk.com/sitemap.xml",
  };
}
