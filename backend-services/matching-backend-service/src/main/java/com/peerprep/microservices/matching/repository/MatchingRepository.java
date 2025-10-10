package com.peerprep.microservices.matching.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.peerprep.microservices.matching.model.UserPreference;

/**
 * Repository interface for managing UserPreference entities in MongoDB.
 */
@Repository
public interface MatchingRepository extends MongoRepository<UserPreference, String> {

}
