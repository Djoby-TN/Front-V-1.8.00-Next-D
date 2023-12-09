// Import necessary dependencies and modules for testing
const { expect } = require('chai');
const {User} = require('./models/models');

// Create a test suite for the User model
describe('User Model', () => {
  // Test case for creating a new user
  it('should create a new user with the provided data', () => {
    // Arrange
    const data = {
      phoneNumber: '1234567890',
      fullName: 'John Doe',
      age: 25,
      avatar: 'path/to/avatar.jpg',
      rating: 4.5,
      userType: 'regular',
      interestedServices: ['service1', 'service2'],
      bio: 'Lorem ipsum dolor sit amet',
      position: {
        lat: 37.7749,
        lng: -122.4194,
      },
    };

    // Act
    const user = new User(data);

    // Assert
    expect(user.phoneNumber).to.equal(data.phoneNumber);
    expect(user.fullName).to.equal(data.fullName);
    expect(user.age).to.equal(data.age);
    expect(user.avatar).to.equal(data.avatar);
    expect(user.rating).to.equal(data.rating);
    expect(user.userType).to.equal(data.userType);
    expect(user.interestedServices).to.deep.equal(data.interestedServices);
    expect(user.bio).to.equal(data.bio);
    expect(user.position.latitude).to.equal(data.position.lat);
    expect(user.position.longitude).to.equal(data.position.lng);
  });

  // Add more test cases for other scenarios if needed
});