import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kids Projects Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body {
        margin: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
      }

      #swagger-ui {
        min-height: 100vh;
      }

      .swagger-ui .topbar .download-url-wrapper {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/swagger.json",
          dom_id: "#swagger-ui",
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
          deepLinking: true,
          displayRequestDuration: true,
          docExpansion: "list",
          persistAuthorization: true,
          tryItOutEnabled: true,
          defaultModelsExpandDepth: 3,
          defaultModelExpandDepth: 3
        });
      };
    </script>
  </body>
</html>`;

export async function GET() {
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
