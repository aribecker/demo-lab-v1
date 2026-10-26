package ariel.iteration2.weather.treasury;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import static ariel.iteration2.weather.treasury.TreasuryModels.*;

@RestController
@RequestMapping("/api/treasury/backup")
public class TreasuryBackupController {
 private final TreasuryBackupService backup;
 public TreasuryBackupController(TreasuryBackupService backup){this.backup=backup;}
 public record Confirm(String confirmation){}
 @GetMapping("/preview") public Object preview(){return backup.preview();}
 @PostMapping("/send") public Object send(@RequestBody Confirm form){if(form.confirmation()==null||form.confirmation().length()>100)throw new Problem(400,"Confirmación inválida.");return backup.send(form.confirmation());}
 @ExceptionHandler(Problem.class)public ResponseEntity<?> problem(Problem e){return ResponseEntity.status(e.status).body(Map.of("message",e.getMessage()));}
}
