package com.hms.records.repository;

import com.hms.records.entity.IcdCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IcdCodeRepository extends JpaRepository<IcdCode, Long> {

    @Query("SELECT i FROM IcdCode i WHERE LOWER(i.code) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :q, '%'))")
    List<IcdCode> searchCodes(@Param("q") String q);
}
