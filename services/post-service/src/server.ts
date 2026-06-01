import app from "./app";

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log("post-service running on http://localhost:" + PORT);
});
