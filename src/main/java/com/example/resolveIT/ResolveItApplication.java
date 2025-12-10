package com.example.resolveIT;

import com.example.resolveIT.model.Role;
import com.example.resolveIT.model.User;
import com.example.resolveIT.repo.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@SpringBootApplication(scanBasePackages = "com.example.resolveIT")
public class ResolveItApplication {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(ResolveItApplication.class, args);
    }
    /*
    @PostConstruct
    public void initAdmin() {
        System.out.println("=== INIT ADMIN CHECK ===");

        var existing = userRepo.findByUsername("admin");
        if (existing.isPresent()) {
            System.out.println("Admin already exists. Skipping creation.");
            return;
        }

        String hash = passwordEncoder.encode("Admin@123");
        User admin = new User("admin", "admin@example.com", hash, Role.ADMIN);
        userRepo.save(admin);

        System.out.println("Admin created with password: Admin@123");
        System.out.println("Hash = " + hash);
    }
    */
    /*
    @Bean
    CommandLineRunner initOfficers() {
        return args -> {

            String pass_encrypted  = passwordEncoder.encode("pppp");

            // ---------- INFRASTRUCTURE OFFICERS ----------
            User infra1 = new User("infra1", "infra1@example.com", pass_encrypted , Role.OFFICER);
            infra1.setName("Rahul Verma");
            infra1.setAge(34);
            infra1.setCategory("Infrastructure");
            infra1.setExperience("5 Years");
            infra1.setQualification("B.Tech Civil Engineering");

            User infra2 = new User("infra2", "infra2@example.com", pass_encrypted , Role.OFFICER);
            infra2.setName("Deepak Sharma");
            infra2.setAge(29);
            infra2.setCategory("Infrastructure");
            infra2.setExperience("3 Years");
            infra2.setQualification("Diploma Civil Engineering");

            User infra3 = new User("infra3", "infra3@example.com", pass_encrypted , Role.OFFICER);
            infra3.setName("Suman Roy");
            infra3.setAge(38);
            infra3.setCategory("Infrastructure");
            infra3.setExperience("10 Years");
            infra3.setQualification("M.Tech Structural Engineering");

            // ---------- SERVICES OFFICERS ----------
            User service1 = new User("service1", "service1@example.com", pass_encrypted , Role.OFFICER);
            service1.setName("Priya Singh");
            service1.setAge(31);
            service1.setCategory("Services");
            service1.setExperience("4 Years");
            service1.setQualification("MBA Public Services");

            User service2 = new User("service2", "service2@example.com", pass_encrypted , Role.OFFICER);
            service2.setName("Harish Kumar");
            service2.setAge(36);
            service2.setCategory("Services");
            service2.setExperience("8 Years");
            service2.setQualification("BBA Administration");

            User service3 = new User("service3", "service3@example.com", pass_encrypted , Role.OFFICER);
            service3.setName("Ananya Bose");
            service3.setAge(27);
            service3.setCategory("Services");
            service3.setExperience("2 Years");
            service3.setQualification("MA Social Welfare");

            // ---------- PUBLIC SAFETY OFFICERS ----------
            User safe1 = new User("safety1", "safety1@example.com", pass_encrypted , Role.OFFICER);
            safe1.setName("Amit Das");
            safe1.setAge(42);
            safe1.setCategory("Public Safety");
            safe1.setExperience("12 Years");
            safe1.setQualification("Police Academy Graduate");

            User safe2 = new User("safety2", "safety2@example.com", pass_encrypted , Role.OFFICER);
            safe2.setName("Vikram Singh");
            safe2.setAge(37);
            safe2.setCategory("Public Safety");
            safe2.setExperience("7 Years");
            safe2.setQualification("Security & Safety Certification");

            User safe3 = new User("safety3", "safety3@example.com", pass_encrypted , Role.OFFICER);
            safe3.setName("Meera Nair");
            safe3.setAge(30);
            safe3.setCategory("Public Safety");
            safe3.setExperience("4 Years");
            safe3.setQualification("M.A. Criminology");

            // Save all users
            userRepo.saveAll(List.of(
                    infra1, infra2, infra3,
                    service1, service2, service3,
                    safe1, safe2, safe3
            ));

            System.out.println(">>>> 9 OFFICERS CREATED SUCCESSFULLY <<<<");
        };
    }

    */

}
