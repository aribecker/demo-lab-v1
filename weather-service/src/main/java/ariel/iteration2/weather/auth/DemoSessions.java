package ariel.iteration2.weather.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class DemoSessions {
    public record Profile(String provider, String accountId, String name, String email,
                          String picture, String locale, String profileUrl, boolean emailVerified) {
        public Profile(String provider,String accountId,String name,String email,String picture,String locale,String profileUrl) {
            this(provider,accountId,name,email,picture,locale,profileUrl,false);
        }
    }
    public record Session(Profile profile, Instant expiresAt, boolean canUseSimulator) {
        public Session(Profile profile,Instant expiresAt) { this(profile,expiresAt,SimulatorAccess.allowed(profile)); }
    }
    public record Exchange(String token, Profile profile, Instant expiresAt, boolean canUseSimulator) {
        public Exchange(String token,Profile profile,Instant expiresAt) { this(token,profile,expiresAt,SimulatorAccess.allowed(profile)); }
    }
    private record Ticket(Profile profile, String challenge, Instant expiresAt) {}
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();
    private final AuthSessionStore sessions;
    public static final long LIFETIME_SECONDS=7*24*60*60;
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;
    public DemoSessions(Clock clock,AuthSessionStore sessions) { this.clock = clock;this.sessions=sessions; }
    public static String digest(String value) {
        try {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.US_ASCII)));
        } catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    private String randomToken() {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private void prune() {
        Instant now = clock.instant();
        tickets.values().removeIf(t -> !t.expiresAt().isAfter(now));
    }
    public synchronized String issue(Profile profile, String challenge) {
        prune();
        if (challenge == null || !challenge.matches("[A-Za-z0-9_-]{43}") || tickets.size() >= 1000)
            throw new IllegalArgumentException("Invalid login request");
        String ticket = randomToken();
        tickets.put(digest(ticket), new Ticket(profile, challenge, clock.instant().plusSeconds(60)));
        return ticket;
    }
    public synchronized Exchange exchange(String ticket, String verifier) {
        prune();
        if (ticket == null || !ticket.matches("[A-Za-z0-9_-]{43}") || verifier == null ||
            !verifier.matches("[A-Za-z0-9_-]{43,128}")) throw new IllegalArgumentException("Invalid login request");
        Ticket found = tickets.get(digest(ticket));
        if (found == null || !MessageDigest.isEqual(found.challenge().getBytes(StandardCharsets.US_ASCII),
                digest(verifier).getBytes(StandardCharsets.US_ASCII))) throw new IllegalArgumentException("Invalid login request");
        String token = randomToken(); Instant createdAt=clock.instant(),expiry = createdAt.plusSeconds(LIFETIME_SECONDS);
        sessions.save(digest(token),found.profile(),createdAt,expiry);
        tickets.remove(digest(ticket));
        return new Exchange(token, found.profile(), expiry);
    }
    public Session find(String token) {
        prune();
        return token == null || !token.matches("[A-Za-z0-9_-]{43}") ? null : sessions.find(digest(token),clock.instant());
    }
    public void revoke(String token) { if (token != null && token.matches("[A-Za-z0-9_-]{43}")) sessions.revoke(digest(token),clock.instant()); }
}
