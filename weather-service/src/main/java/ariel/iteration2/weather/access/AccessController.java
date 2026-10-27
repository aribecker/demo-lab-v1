package ariel.iteration2.weather.access;

import ariel.iteration2.weather.auth.DemoSessions;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/access")
public class AccessController {
 private final AccessDirectory directory;private final DemoSessions sessions;
 public AccessController(AccessDirectory directory,DemoSessions sessions){this.directory=directory;this.sessions=sessions;}
 @GetMapping("/me") public ResponseEntity<AccessDirectory.Capabilities> me(@RequestHeader(value="Authorization",required=false)String header){var session=sessions.find(header!=null&&header.startsWith("Bearer ")?header.substring(7):null);return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(directory.capabilities(session==null?null:session.profile()));}
 @GetMapping("/users") public List<AccessDirectory.User> users(){return directory.users();}
 @GetMapping("/users/{id}") public AccessDirectory.User user(@PathVariable long id){return directory.getUser(id);}
 @PostMapping("/users") @ResponseStatus(HttpStatus.CREATED) public AccessDirectory.User addUser(@RequestBody AccessDirectory.UserInput input){return directory.createUser(input);}
 @PutMapping("/users/{id}") public AccessDirectory.User editUser(@PathVariable long id,@RequestBody AccessDirectory.UserInput input){return directory.updateUser(id,input);}
 @DeleteMapping("/users/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteUser(@PathVariable long id){directory.deleteUser(id);}
 @GetMapping("/groups") public List<AccessDirectory.Group> groups(){return directory.groups();}
 @GetMapping("/groups/{id}") public AccessDirectory.Group group(@PathVariable long id){return directory.getGroup(id);}
 @PostMapping("/groups") @ResponseStatus(HttpStatus.CREATED) public AccessDirectory.Group addGroup(@RequestBody AccessDirectory.GroupInput input){return directory.createGroup(input);}
 @PutMapping("/groups/{id}") public AccessDirectory.Group editGroup(@PathVariable long id,@RequestBody AccessDirectory.GroupInput input){return directory.updateGroup(id,input);}
 @DeleteMapping("/groups/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteGroup(@PathVariable long id){directory.deleteGroup(id);}
 @GetMapping("/groups/{id}/members") public AccessDirectory.Members members(@PathVariable long id){return directory.members(id);}
 @PutMapping("/groups/{id}/members") public AccessDirectory.Members members(@PathVariable long id,@RequestBody AccessDirectory.MemberInput input){return directory.replaceMembers(id,input);}
}
