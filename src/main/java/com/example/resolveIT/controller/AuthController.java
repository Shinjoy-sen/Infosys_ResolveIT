
package com.example.resolveIT.controller;
import com.example.resolveIT.model.Role;
import com.example.resolveIT.model.User;
import com.example.resolveIT.repo.UserRepository;
import com.example.resolveIT.security.JwtUtil;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

    private final UserRepository userRepo;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepo, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepo.existsByUsername(user.getUsername())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.USER); // default registration is normal user
        userRepo.save(user);
        return ResponseEntity.ok("User registered successfully");
    }

@PostMapping("/register-admin")
public ResponseEntity<?> registerAdmin(@RequestBody User user) {
    if (userRepo.existsByUsername(user.getUsername())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Username already exists");
    }
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    user.setRole(Role.ADMIN); // admin role
    userRepo.save(user);
    return ResponseEntity.ok("Admin registered successfully");
}


@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Map<String, String> body) {

    System.out.println("LOGIN DEBUG ----");
    System.out.println("RAW BODY: " + body);

    String username = body.get("username");
    String password = body.get("password");

    System.out.println("username = " + username);
    System.out.println("password = " + password);

    Optional<User> opt = userRepo.findByUsername(username);

    if (opt.isPresent()) {
        User u = opt.get();
        System.out.println("DB HASH = " + u.getPassword());
        System.out.println("PASSWORD MATCH = " + passwordEncoder.matches(password, u.getPassword()));
        System.out.println("ROLE = " + u.getRole());
    } else {
        System.out.println("User not found in DB!");
    }

    // existing logic
    if (opt.isPresent() && passwordEncoder.matches(password, opt.get().getPassword())) {
        String token = jwtUtil.generateToken(username);
        return ResponseEntity.ok(
            Map.of(
                "token", token,
                "username", username,
                "role", opt.get().getRole().name()
            )
        );
    }

    return ResponseEntity.status(401).body("invalid_credentials");
}


    @PostMapping("/anonymous")
    public ResponseEntity<?> anonymous() {
        String anon = "anon-" + UUID.randomUUID().toString().substring(0, 8);
        String token = jwtUtil.generateToken(anon);
        return ResponseEntity.ok(Map.of("token", token, "username", anon, "anonymous", true));
    }

    @GetMapping("/debug")
    public ResponseEntity<?> debug() {
        return ResponseEntity.ok(userRepo.findAll());
    }

}
