package ariel.sdd.weather;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
@RestController
public class ClientDiagnosticsController {
 private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(ClientDiagnosticsController.class);
 public record Event(String id,String event,Integer attempt,Integer status,Long elapsedMs,String clientTime){}
 @PostMapping("/api/diagnostics") public ResponseEntity<Void> record(@RequestBody Event event){
  String name=event.event()!=null&&event.event().matches("[a-z-]{1,40}")?event.event():"unknown";
  log.info("WEATHER_TRACE id={} stage=browser event={} attempt={} status={} elapsedMs={} clientTime={}",Diagnostics.id(event.id()),name,event.attempt(),event.status(),event.elapsedMs(),event.clientTime()!=null&&event.clientTime().matches("[0-9TZ:.-]{1,40}")?event.clientTime():"unknown");
  return ResponseEntity.noContent().build();
 }
}
