
package com.example.resolveIT.service;

import com.example.resolveIT.model.User;
import com.example.resolveIT.model.Role;
import com.example.resolveIT.repo.UserRepository;


import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }
    
    public User register(String username, String password, String email, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash(encoder.encode(password));
        u.setEmail(email);
        u.setRole(role);
        return userRepo.save(u);
    }
    
    public boolean checkPassword(User u, String raw) {
        return encoder.matches(raw, u.getPasswordHash());
    }
}
