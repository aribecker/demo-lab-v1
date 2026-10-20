package ariel.iteration2.weather.auth;
import java.util.Map;
final class Profiles {
    private static String text(Map<String,Object> a,String... keys) {
        for(String k:keys) {Object v=a.get(k);if(v!=null&&!v.toString().isBlank())return v.toString();}return null;
    }
    private static String url(String value) {
        return value != null && value.startsWith("https://") ? value : null;
    }
    static DemoSessions.Profile from(String provider, Map<String,Object> a) {
        return new DemoSessions.Profile(provider,text(a,"sub","id"),
            text(a,"name","displayName","login"),text(a,"email","mail","userPrincipalName"),
            url(text(a,"picture","avatar_url")),text(a,"locale"),url(text(a,"html_url")));
    }
}
