package com.example.resolveIT.repo;

import com.example.resolveIT.model.User;
import com.example.resolveIT.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    List<User> findByCategoryAndRole(String category, Role role);

    List<User> findByRole(Role role);

}
