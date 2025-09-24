package com.peerprep.microservices.matching.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.peerprep.microservices.matching.model.UserPreference;

@Repository
public interface MatchingRepository extends MongoRepository<UserPreference, String> {

}
