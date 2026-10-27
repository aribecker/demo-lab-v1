package ariel.iteration2.weather.treasury;

import ariel.iteration2.weather.auth.DemoSessions;
import jakarta.servlet.http.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.config.annotation.*;

/** Explicit treasury grants, using the existing durable login; no implicit administrator. */
@Configuration
public class TreasuryAccess implements WebMvcConfigurer,HandlerInterceptor {
 private final DemoSessions sessions;
 private final TreasuryRepository repo;
 private final Set<String> catalogEditors;
 private final String bootstrapOwner;
 public TreasuryAccess(DemoSessions sessions,TreasuryRepository repo,@Value("${treasury.catalog-editors:}") String editors,@Value("${treasury.bootstrap-owner-email:}") String bootstrapOwner){
  this.sessions=sessions;this.repo=repo;this.bootstrapOwner=bootstrapOwner.trim();
  catalogEditors=new HashSet<>();for(String email:editors.split(","))if(!email.isBlank())catalogEditors.add(email.trim().toLowerCase(Locale.ROOT));
 }
 @Override public void addInterceptors(InterceptorRegistry registry){registry.addInterceptor(this).addPathPatterns("/api/treasury","/api/treasury/**");}
 private boolean bootstrapOwner(DemoSessions.Profile profile){return profile!=null&&"google".equals(profile.provider())&&profile.emailVerified()&&profile.email()!=null&&!bootstrapOwner.isBlank()&&bootstrapOwner.equalsIgnoreCase(profile.email());}
 public boolean catalogEditor(DemoSessions.Profile profile){return profile!=null&&"google".equals(profile.provider())&&profile.emailVerified()&&profile.email()!=null&&(catalogEditors.contains(profile.email().toLowerCase(Locale.ROOT))||bootstrapOwner(profile));}
 private boolean deny(HttpServletResponse response,int status,String message)throws java.io.IOException{
  response.setStatus(status);response.setContentType("application/json;charset=UTF-8");response.getWriter().write("{\"message\":\""+message+"\"}");return false;
 }
 @Override public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler)throws Exception {
  response.setHeader("Cache-Control","no-store");response.setHeader("X-Content-Type-Options","nosniff");
  String path=request.getRequestURI();
  if("OPTIONS".equals(request.getMethod())||("GET".equals(request.getMethod())&&path.equals("/api/treasury/themes")))return true;
  String header=request.getHeader("Authorization");
  var session=sessions.find(header!=null&&header.startsWith("Bearer ")?header.substring(7):null);
  if(session==null)return deny(response,401,"Iniciá sesión para acceder a tesorería.");
  var profile=session.profile();
  if(profile.accountId()==null||profile.provider()==null)return deny(response,403,"La identidad autenticada no es válida para tesorería.");
  request.setAttribute("treasury.profile",profile);
  request.setAttribute("treasury.actor",profile.provider()+":"+profile.accountId());
  if(bootstrapOwner(profile))repo.provisionOwnerPermissions(profile.provider(),profile.accountId());
  boolean editor=catalogEditor(profile);request.setAttribute("treasury.catalog-editor",editor);
  var variables=(Map<?,?>)request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
  String inst=variables!=null?(String)variables.get("inst"):null;
  if(inst!=null){
   String permission=Set.of("GET","HEAD").contains(request.getMethod())?"can_read":path.endsWith("/post")||path.endsWith("/reverse")?"can_confirm":"can_write";
   try{if(!repo.permitted(inst,profile.provider(),profile.accountId(),permission))return deny(response,403,"No tenés permiso para esta operación en la institución.");}
   catch(TreasuryModels.Problem unavailable){return deny(response,503,"No se pudo verificar el permiso. Reintentá.");}
  }else if(!path.equals("/api/treasury/access")&&!(path.equals("/api/treasury/institutions")&&"GET".equals(request.getMethod()))&&!editor){
   return deny(response,403,"Esta acción global requiere autorización explícita de catálogo.");
  }
  return true;
 }
}
