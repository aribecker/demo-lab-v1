package ariel.iteration2.weather.treasury;

import static ariel.iteration2.weather.treasury.TreasuryModels.*;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/treasury")
public class TreasuryController {
 private final TreasuryRepository repo;
 public TreasuryController(TreasuryRepository repo){this.repo=repo;}
 private Map<String,String> saved(String id){return Map.of("id",id);}
 private String actor(HttpServletRequest request){return (String)request.getAttribute("treasury.actor");}
 @GetMapping("/themes") public Object themes(){return repo.themes();}
 @GetMapping("/institutions") public Object institutions(HttpServletRequest request){
  var p=(ariel.iteration2.weather.auth.DemoSessions.Profile)request.getAttribute("treasury.profile");
  return repo.institutions().stream().filter(i->repo.permitted((String)i.get("id"),p.provider(),p.accountId(),"can_read")).toList();
 }
 @GetMapping("/access") public Object access(HttpServletRequest request){return Map.of("catalog_editor",Boolean.TRUE.equals(request.getAttribute("treasury.catalog-editor")));}
 @GetMapping("/institutions/{inst}/access") public Object access(@PathVariable String inst,HttpServletRequest request){
  var p=(ariel.iteration2.weather.auth.DemoSessions.Profile)request.getAttribute("treasury.profile");
  return Map.of("can_write",repo.permitted(inst,p.provider(),p.accountId(),"can_write"),"can_confirm",repo.permitted(inst,p.provider(),p.accountId(),"can_confirm"));
 }
 @GetMapping("/institutions/{inst}/suppliers") public Object suppliers(@PathVariable String inst){return repo.suppliers(inst);}
 @PostMapping("/institutions/{inst}/suppliers") public Object createSupplier(@PathVariable String inst,@RequestBody SupplierForm form){return saved(repo.saveSupplier(inst,null,form));}
 @PostMapping("/institutions/{inst}/suppliers/{id}") public Object editSupplier(@PathVariable String inst,@PathVariable String id,@RequestBody SupplierForm form){return saved(repo.saveSupplier(inst,id,form));}
 @PostMapping("/institutions/{inst}/suppliers/{id}/delete") public void deleteSupplier(@PathVariable String inst,@PathVariable String id){repo.deactivateSupplier(inst,id);}
 @PostMapping("/institutions") public Object createInstitution(@RequestBody Institution form){return saved(repo.saveInstitution(null,form));}
 @PostMapping("/institutions/{id}") public Object editInstitution(@PathVariable String id,@RequestBody Institution form){return saved(repo.saveInstitution(id,form));}
 @PostMapping("/institutions/{id}/delete") public void deleteInstitution(@PathVariable String id){repo.deleteInstitution(id);}
 @GetMapping("/institutions/{inst}/members") public Object members(@PathVariable String inst){return repo.members(inst);}
 @PostMapping("/institutions/{inst}/members") public Object createMember(@PathVariable String inst,@RequestBody Member form){return saved(repo.saveMember(inst,null,form));}
 @PostMapping("/institutions/{inst}/members/{id}") public Object editMember(@PathVariable String inst,@PathVariable String id,@RequestBody Member form){return saved(repo.saveMember(inst,id,form));}
 @PostMapping("/institutions/{inst}/members/{id}/delete") public void deleteMember(@PathVariable String inst,@PathVariable String id){repo.deleteMember(inst,id);}
 @GetMapping("/institutions/{inst}/accounts") public Object accounts(@PathVariable String inst){return repo.accounts(inst);}
 @PostMapping("/institutions/{inst}/accounts") public Object createAccount(@PathVariable String inst,@RequestBody Account form){return saved(repo.saveAccount(inst,null,form));}
 @PostMapping("/institutions/{inst}/accounts/{id}") public Object editAccount(@PathVariable String inst,@PathVariable String id,@RequestBody Account form){return saved(repo.saveAccount(inst,id,form));}
 @PostMapping("/institutions/{inst}/accounts/{id}/delete") public void deleteAccount(@PathVariable String inst,@PathVariable String id){repo.deleteAccount(inst,id);}
 @GetMapping("/institutions/{inst}/entries") public Object entries(@PathVariable String inst){return repo.entries(inst);}
 @GetMapping("/institutions/{inst}/entries/{id}") public Object detail(@PathVariable String inst,@PathVariable String id){return repo.detail(inst,id);}
 @PostMapping("/institutions/{inst}/entries") public Object createEntry(@PathVariable String inst,@RequestBody Entry form,HttpServletRequest r){return saved(repo.saveEntry(inst,null,form,actor(r)));}
 @PostMapping("/institutions/{inst}/entries/{id}") public Object editEntry(@PathVariable String inst,@PathVariable String id,@RequestBody Entry form,HttpServletRequest r){return saved(repo.saveEntry(inst,id,form,actor(r)));}
 @PostMapping("/institutions/{inst}/entries/{id}/post") public void post(@PathVariable String inst,@PathVariable String id){repo.post(inst,id);}
 @PostMapping("/institutions/{inst}/entries/{id}/delete") public void deleteEntry(@PathVariable String inst,@PathVariable String id){repo.deleteEntry(inst,id);}
 @PostMapping("/institutions/{inst}/entries/{id}/reverse") public Object reverse(@PathVariable String inst,@PathVariable String id,@RequestBody Reversal form,HttpServletRequest r){return saved(repo.reverse(inst,id,form,actor(r)));}
 @PostMapping("/institutions/{inst}/entries/{id}/attachments") public Object attach(@PathVariable String inst,@PathVariable String id,@RequestParam MultipartFile file)throws IOException {
  if(file.getSize()>5242880)throw new Problem(400,"El comprobante supera 5 MB.");return saved(repo.attach(inst,id,file.getOriginalFilename(),file.getBytes()));
 }
 @GetMapping("/institutions/{inst}/entries/{id}/attachments/{attachment}") public ResponseEntity<byte[]> attachment(@PathVariable String inst,@PathVariable String id,@PathVariable String attachment){
  var file=repo.attachment(inst,id,attachment);
  return ResponseEntity.ok().header("Content-Disposition",ContentDisposition.attachment().filename((String)file.get("file_name"),java.nio.charset.StandardCharsets.UTF_8).build().toString())
   .header("X-Content-Type-Options","nosniff").contentType(MediaType.parseMediaType((String)file.get("content_type"))).body((byte[])file.get("file_data"));
 }
 @PostMapping("/institutions/{inst}/entries/{id}/attachments/{attachment}/delete") public void deleteAttachment(@PathVariable String inst,@PathVariable String id,@PathVariable String attachment){repo.deleteAttachment(inst,id,attachment);}
 @GetMapping("/institutions/{inst}/balance") public Object balance(@PathVariable String inst,@RequestParam LocalDate cutoff){return repo.balance(inst,cutoff);}
 @GetMapping("/institutions/{inst}/journal") public Object journal(@PathVariable String inst,@RequestParam LocalDate from,@RequestParam LocalDate to){return repo.journal(inst,from,to);}
 @ExceptionHandler(Problem.class) public ResponseEntity<?> problem(Problem e){return ResponseEntity.status(e.status).body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(DataIntegrityViolationException.class) public ResponseEntity<?> conflict(){return ResponseEntity.status(409).body(Map.of("message","El código ya existe o el registro tiene relaciones que impiden esta operación."));}
 @ExceptionHandler(org.springframework.dao.DataAccessException.class) public ResponseEntity<?> database(){return ResponseEntity.status(503).body(Map.of("message","No se pudo completar la operación en PostgreSQL. Reintentá."));}
 @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class) public ResponseEntity<?> large(){return ResponseEntity.status(413).body(Map.of("message","El comprobante supera 5 MB."));}
}

