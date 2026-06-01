import app from "./app";

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log("feed-service running on http://localhost:" + PORT);
});
