package ariel.iteration2.weather.simulation;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SimulationConfiguration {
    @Bean
    SimulationStore simulationStore(@Value("${simulation.database-url:}") String connection, ObjectMapper json) {
        return new SimulationStore(connection,json);
    }
}
