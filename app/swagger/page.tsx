export default function SwaggerPage() {
  return (
    <main className="h-screen w-screen bg-white">
      <iframe
        src="/swagger-frame"
        title="Swagger UI"
        className="h-full w-full border-0"
      />
    </main>
  );
}
