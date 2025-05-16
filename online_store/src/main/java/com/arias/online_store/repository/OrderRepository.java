package com.arias.online_store.repository;

import com.arias.online_store.entity.Order;
import com.arias.online_store.entity.OrderStatus;
import com.arias.online_store.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByUserId(Integer userId);

    Optional<Order> findFirstByUserIdAndStatus(Integer userId, OrderStatus status);

    Optional<Order> findByIdAndUserIdAndStatusIn(Integer id, Integer userId, Collection<OrderStatus> statuses);

    List<Order> findByUserAndStatus(User user, OrderStatus status);

    boolean existsByOrderItems_Product_Id(Integer productId);

    Long countByStatus(OrderStatus status);

    List<Order> findByStatus(OrderStatus status);

    Integer countByUserIdAndStatus(Integer userId, OrderStatus status);

    List<Order> findByUserIdAndStatus(Integer userId, OrderStatus status);
}
