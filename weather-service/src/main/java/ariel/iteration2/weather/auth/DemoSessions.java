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
                          String picture, String locale, String profileUrl) {}
    public record Session(Profile profile, Instant expiresAt) {}
    public record Exchange(String token, Profile profile, Instant expiresAt) {}
    private record Ticket(Profile profile, String challenge, Instant expiresAt) {}
    private final Map<String, Ticket> tickets = new ConcurrentHashMap<>();
    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;
    public DemoSessions(Clock clock) { this.clock = clock; }
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
        sessions.values().removeIf(s -> !s.expiresAt().isAfter(now));
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
        if (sessions.size() >= 1000) throw new IllegalArgumentException("Please try again later");
        tickets.remove(digest(ticket));
        String token = randomToken(); Instant expiry = clock.instant().plusSeconds(1800);
        sessions.put(digest(token), new Session(found.profile(), expiry));
        return new Exchange(token, found.profile(), expiry);
    }
    public Session find(String token) {
        prune();
        return token == null || !token.matches("[A-Za-z0-9_-]{43}") ? null : sessions.get(digest(token));
    }
    public void revoke(String token) { if (token != null) sessions.remove(digest(token)); }
}
