package com.example.resolveIT.controller;

import com.example.resolveIT.model.Complaint;
import com.example.resolveIT.model.ComplaintStatus;
import com.example.resolveIT.repo.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

//import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:8090")
public class AdminController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @GetMapping("/complaints")
    public List<Complaint> getAllComplaints() {
        // now returns complaints sorted by urgency
        return complaintRepository.findAllSorted();
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignComplaint(@RequestBody Map<String, String> body) {
        Long complaintId = Long.parseLong(body.get("complaintId"));
        Long officerId = Long.parseLong(body.get("officerId"));

        Complaint c = complaintRepository.findById(complaintId).orElse(null);
        if (c == null) return ResponseEntity.badRequest().body("Complaint not found");

        c.setAssignedOfficerId(officerId);
        c.setStatus(ComplaintStatus.ASSIGNED);

        complaintRepository.save(c);

        return ResponseEntity.ok("Assigned successfully");
    }

}
