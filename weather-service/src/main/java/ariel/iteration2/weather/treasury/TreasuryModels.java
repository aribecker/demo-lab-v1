package ariel.iteration2.weather.treasury;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class TreasuryModels {
 private TreasuryModels() {}
 public record Institution(String name,String code,String theme_id,boolean active) {}
 public record Member(String first_name,String last_name,String residence,String membership_number,String email,String phone,String notes,boolean active) {}
 public record Account(String code,String name,String type,String parent_id,String currency_policy,boolean allows_posting,boolean active) {}
 public record Line(String account_id,String member_id,String description,String currency,BigDecimal debit,BigDecimal credit) {}
 public record Entry(LocalDate entry_date,String description,String reference,List<Line> lines) {}
 public record Reversal(LocalDate entry_date,String description) {}
 public static class Problem extends RuntimeException {
  public final int status;
  public Problem(int status,String message){super(message);this.status=status;}
 }
 public static String text(String value,int max,boolean required) {
  String clean=value==null?"":value.trim();
  if((required&&clean.isEmpty())||clean.length()>max)throw new Problem(400,"Completá los campos obligatorios y respetá la longitud máxima.");
  return clean;
 }
 public static String nullable(String value){return value==null||value.isBlank()?null:value;}
}
