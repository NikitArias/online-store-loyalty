package com.arias.online_store.entity;


import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@Embeddable
@EqualsAndHashCode
public class OrderItemId implements Serializable {
    private Integer order;
    private Integer product;

}
