import type { QuestionPreview } from "@/types/QuestionPreview";
import type { Question } from "@/types/Question";
import type { Attempt } from "@/types/Attempt";

export const initialHistory: QuestionPreview[] = [
  {
    questionName: "Two Sum",
    topic: "Array",
    difficulty: "Easy",
    timeLimit: "2:00:00",
  },
  {
    questionName: "Valid Palindrome",
    topic: "String",
    difficulty: "Easy",
    timeLimit: "1:00:00",
  },
  {
    questionName: "Merge Sorted Array",
    topic: "Array",
    difficulty: "Easy",
    timeLimit: "0:45:00",
  },
  {
    questionName: "Reverse Linked List",
    topic: "Linked List",
    difficulty: "Easy",
    timeLimit: "1:15:00",
  },
  {
    questionName: "Contains Duplicate",
    topic: "Array",
    difficulty: "Easy",
    timeLimit: "0:25:00",
  },
];

export const mockQuestions: Question[] = [
  {
    title: "Two Sum",
    body: `
Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.
Example 1:
  Input: nums = [2,7,11,15], target = 9
  Output: [0,1]
  Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
  
Example 2:
  Input: nums = [3,2,4], target = 6
  Output: [1,2]
  
Example 3:
  Input: nums = [3,3], target = 6
  Output: [0,1]
  
Constraints:

    2 <= nums.length <= 104
    -109 <= nums[i] <= 109
    -109 <= target <= 109
    Only one valid answer exists.
    
  Follow-up: Can you come up with an algorithm that is less than O(n2) time complexity?
  `,
    topics: ["Array", "Hash Table"],
    hints: [
      "This is the first hint. Think about the edge cases.",
      "This is the second hint. Consider a different data structure, like a hash map.",
    ],
    answer: `
  class GfG {

    static boolean twoSum(int[] arr, int target){
        int n = arr.length;

        for (int i = 0; i < n; i++) {
          
            // For each element arr[i], check every
            // other element arr[j] that comes after it
            for (int j = i + 1; j < n; j++) {
              
                // Check if the sum of the current pair
                // equals the target
                if (arr[i] + arr[j] == target) {
                    return true;
                }
            }
        }
      
        // If no pair is found after checking
        // all possibilities
        return false;
    }

    public static void main(String[] args){

        int[] arr = { 0, -1, 2, -3, 1 };
        int target = -2;
      
        if (twoSum(arr, target))
            System.out.println("true");
        else
            System.out.println("false");
    }
}`,
    difficulty: "Easy",
    timeLimit: "1:00:00",
  },
];

export const mockAttempts: Attempt[] = [
  {
    question: mockQuestions[0],
    date: new Date("2024-05-20T10:00:00"),
    partner: "John",
    timeTaken: "1:00:00",
  },
];
