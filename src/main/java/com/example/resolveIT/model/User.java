
package com.example.resolveIT.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;
    
    //for officer
    private String name;
    private Integer age;
    private String category;
    private String experience;
    private String qualification;


    @Enumerated(EnumType.STRING)
    private Role role = Role.USER; // Default role

    private Instant createdAt = Instant.now();

    public User() {
    }
    
    public User(String username, String email, String passwordHash, Role role) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return passwordHash; }
    public void setPassword(String password) { this.passwordHash = password; }
}
