
package com.example.resolveIT.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
public class ComplaintFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Complaint complaint;

    private String filename;
    private String storedPath;
    private String contentType;
    private Instant uploadedAt = Instant.now();
}
