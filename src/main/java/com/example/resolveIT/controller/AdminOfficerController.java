package com.example.resolveIT.controller;

import com.example.resolveIT.model.Role;
import com.example.resolveIT.model.User;
import com.example.resolveIT.repo.UserRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/admin/officer")
@CrossOrigin(origins = "http://localhost:8090")
public class AdminOfficerController {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public User createOfficer(@RequestBody User officer) {

        officer.setRole(Role.OFFICER);  // ⭐ Set officer role
        
        // Encode password
        officer.setPasswordHash(
            passwordEncoder.encode(officer.getPasswordHash())
        );

        return userRepo.save(officer);
    }

    @GetMapping("/list")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getAllOfficers() {
        return userRepo.findByRole(Role.OFFICER);
    }

    @GetMapping("/by-category/{cat}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> getByCategory(@PathVariable String cat) {
        return userRepo.findByCategoryAndRole(cat, Role.OFFICER);
    }


}
