package com.example.resolveIT.repo;

import com.example.resolveIT.model.Complaint;
import com.example.resolveIT.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

//import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    // USER get complaints submitted by a particular user
    List<Complaint> findBySubmittedBy(String submittedBy);

    // ADMIN: Sorted complaints 
    @Query(value = """
            SELECT * FROM complaint
            ORDER BY FIELD(urgency, 'HIGH', 'MID', 'LOW')
            """, nativeQuery = true)
    List<Complaint> findAllSorted();

    // fetch complaints assigned to an officer
    List<Complaint> findByAssignedOfficerId(Long officerId);

    // fetch complaints by status 
    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByStatusInAndCreatedAtBefore(List<String> statuses, LocalDateTime date);

    @Query("SELECT c FROM Complaint c WHERE c.status IN :statuses AND c.createdAt < :cutoff")
    List<Complaint> findEscalatableComplaints(
            @Param("statuses") List<String> statuses,
            @Param("cutoff") LocalDateTime cutoff
    );

    List<Complaint> findByMarkEscalatedTrue();

}
