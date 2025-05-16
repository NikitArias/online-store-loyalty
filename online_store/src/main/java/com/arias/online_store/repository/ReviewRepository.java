package com.arias.online_store.repository;

import com.arias.online_store.entity.Review;
import com.arias.online_store.entity.ReviewId;
import com.arias.online_store.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, ReviewId> {
    List<Review> findByProductId(Integer product_id);
    List<Review> findByUser(User user);
    Integer countByUserId(Integer userId);
}
