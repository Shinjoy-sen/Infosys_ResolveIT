package com.example.resolveIT.controller;

import com.example.resolveIT.model.Complaint;
import com.example.resolveIT.repo.ComplaintRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
//import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin
public class ComplaintController {

    private final ComplaintRepository repo;


    private final Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");

    public ComplaintController(ComplaintRepository repo) throws Exception {
        this.repo = repo;

        // ✔ FIX: ensure folder exists even inside jar or IDE
        Files.createDirectories(uploadDir);
    }

    @GetMapping("/my")
    public List<Complaint> my(Authentication auth) {
        String user = (auth != null) ? auth.getName() : "anon";
        return repo.findBySubmittedBy(user);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestParam Map<String, String> form,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication auth) throws Exception 
    {
        System.out.println("FILES RECEIVED = " + (files == null ? "NULL" : files.size()));

        String user = (auth != null) ? auth.getName() : "anon";

        Complaint c = new Complaint();
        c.setSubmittedBy(user);
        c.setName(form.getOrDefault("name",""));
        c.setEmail(form.getOrDefault("email",""));
        c.setCategory(form.getOrDefault("category",""));
        c.setSubcategory(form.getOrDefault("subcategory",""));
        c.setDescription(form.getOrDefault("description",""));
        c.setLocation(form.getOrDefault("location",""));
        c.setUrgency(form.getOrDefault("urgency","LOW"));
        c.setCreatedAt(LocalDateTime.now());


        String date = form.get("dateOfIncident");
        if (date != null && !date.isBlank()) {
            c.setDateOfIncident(LocalDate.parse(date));
        }

        List<String> saved = new ArrayList<>();

        if (files != null) {
            for (MultipartFile f : files) {
                if (f.isEmpty()) continue;

                String fname = System.currentTimeMillis() + "_" + f.getOriginalFilename();
                Path target = uploadDir.resolve(fname);

                System.out.println("Saving -> " + target.toAbsolutePath());

                Files.copy(f.getInputStream(), target);

                saved.add(fname);
            }
        }

        c.setAttachments(String.join(",", saved));

        Complaint savedC = repo.save(c);
        

        return ResponseEntity.ok(Map.of("id", savedC.getId(), "attachments", saved));
    }

}
