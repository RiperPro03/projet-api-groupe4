$services = @(
  @{ Path = "services/auth-service"; Name = "auth-service"; Port = 3001 },
  @{ Path = "services/user-service"; Name = "user-service"; Port = 3002 },
  @{ Path = "services/post-service"; Name = "post-service"; Port = 3003 },
  @{ Path = "services/follow-service"; Name = "follow-service"; Port = 3004 },
  @{ Path = "services/feed-service"; Name = "feed-service"; Port = 3005 }
)

foreach ($service in $services) {
  $content = @'
import app from "./app";

const PORT = process.env.PORT || __PORT__;

app.listen(PORT, () => {
  console.log("__SERVICE_NAME__ running on http://localhost:" + PORT);
});
'@

  $content = $content.Replace("__PORT__", $service.Port)
  $content = $content.Replace("__SERVICE_NAME__", $service.Name)

  Set-Content "$($service.Path)\src\server.ts" $content
}