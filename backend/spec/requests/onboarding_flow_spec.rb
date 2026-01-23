# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Onboarding Flow Integration" do
  include AuthHelpers

  describe "Complete onboarding flow" do
    describe "Step 1: User registration" do
      let(:user_params) do
        {
          user: {
            email: "newuser@example.com",
            name: "New User",
            password: "password123",
            password_confirmation: "password123"
          }
        }
      end

      it "creates user via POST /api/v1/auth/register" do
        expect do
          post "/api/v1/auth/register", params: user_params
        end.to change(User, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["user"]["email"]).to eq("newuser@example.com")
        expect(response.parsed_body["user"]["name"]).to eq("New User")
      end

      it "returns onboarding_required flag for new user" do
        post "/api/v1/auth/register", params: user_params

        expect(response.parsed_body["user"]["onboarding_required"]).to be true
      end

      it "returns validation errors for invalid params" do
        post "/api/v1/auth/register", params: { user: { email: "invalid" } }

        expect(response).to have_http_status(:unprocessable_content)
      end

      it "prevents duplicate email registration" do
        create(:user, email: "existing@example.com")

        post "/api/v1/auth/register", params: {
          user: {
            email: "existing@example.com",
            name: "Test",
            password: "password123",
            password_confirmation: "password123"
          }
        }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("already registered")
      end
    end

    describe "Step 2: Family creation" do
      let(:user) { create(:user) }
      let(:family_params) do
        {
          family: {
            name: "The Smith Family",
            timezone: "America/New_York"
          }
        }
      end

      it "creates family via POST /api/v1/families" do
        expect do
          post "/api/v1/families", params: family_params, headers: auth_headers(user)
        end.to change(Family, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["family"]["name"]).to eq("The Smith Family")
      end

      it "automatically makes creator the admin" do
        post "/api/v1/families", params: family_params, headers: auth_headers(user)

        family = Family.last
        membership = family.family_memberships.find_by(user: user)

        expect(membership).to be_present
        expect(membership.role).to eq("admin")
      end

      it "returns family with members including creator" do
        post "/api/v1/families", params: family_params, headers: auth_headers(user)

        members = response.parsed_body["family"]["members"]
        expect(members.length).to eq(1)
        expect(members[0]["user_id"]).to eq(user.id)
        expect(members[0]["role"]).to eq("admin")
      end

      it "first family member is always admin regardless of order" do
        # This verifies the business rule that the first member gets admin role
        post "/api/v1/families", params: family_params, headers: auth_headers(user)

        family = Family.last
        expect(family.family_memberships.count).to eq(1)
        expect(family.family_memberships.first.admin?).to be true
      end
    end

    describe "Step 3: Inviting family members" do
      let(:admin_user) { create(:user) }
      let(:family) { create(:family) }

      before do
        create(:family_membership, :admin, family: family, user: admin_user)
      end

      it "creates invitation via POST /api/v1/families/:id/invitations" do
        expect do
          post "/api/v1/families/#{family.id}/invitations",
               params: { invitation: { email: "invited@example.com", role: "adult" } },
               headers: auth_headers(admin_user)
        end.to change(Invitation, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["invitation"]["email"]).to eq("invited@example.com")
        expect(response.parsed_body["invitation"]["role"]).to eq("adult")
      end

      it "invitation has correct attributes" do
        post "/api/v1/families/#{family.id}/invitations",
             params: { invitation: { email: "invited@example.com", role: "teen" } },
             headers: auth_headers(admin_user)

        invitation = Invitation.last
        expect(invitation.family).to eq(family)
        expect(invitation.inviter).to eq(admin_user)
        expect(invitation.email).to eq("invited@example.com")
        expect(invitation.role).to eq("teen")
        expect(invitation.expires_at).to be > Time.current
        expect(invitation.token).to be_present
      end

      it "prevents inviting existing family member" do
        existing_member = create(:user, email: "existing@example.com")
        create(:family_membership, family: family, user: existing_member)

        post "/api/v1/families/#{family.id}/invitations",
             params: { invitation: { email: "existing@example.com", role: "adult" } },
             headers: auth_headers(admin_user)

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["error"]).to include("already a member")
      end
    end

    describe "Step 4: Accepting invitation" do
      let(:admin_user) { create(:user) }
      let(:family) { create(:family) }
      let(:invitation) do
        create(:invitation, family: family, inviter: admin_user, email: "invitee@example.com", role: :adult)
      end

      before do
        create(:family_membership, :admin, family: family, user: admin_user)
      end

      context "with existing authenticated user" do
        let(:invitee) { create(:user, email: "different@example.com") }

        it "accepts invitation and creates membership" do
          expect do
            post "/api/v1/invitations/#{invitation.token}/accept", headers: auth_headers(invitee)
          end.to change(FamilyMembership, :count).by(1)

          expect(response).to have_http_status(:ok)
          expect(response.parsed_body["message"]).to include("accepted")
        end

        it "assigns the correct role from invitation" do
          post "/api/v1/invitations/#{invitation.token}/accept", headers: auth_headers(invitee)

          membership = FamilyMembership.find_by(user: invitee, family: family)
          expect(membership.role).to eq("adult")
        end

        it "marks invitation as accepted" do
          post "/api/v1/invitations/#{invitation.token}/accept", headers: auth_headers(invitee)

          expect(invitation.reload.accepted?).to be true
        end
      end

      context "with new user registration during acceptance" do
        it "creates user and accepts invitation" do
          user_params = {
            user: {
              name: "New Invitee",
              password: "password123",
              password_confirmation: "password123"
            }
          }

          expect do
            post "/api/v1/invitations/#{invitation.token}/accept", params: user_params
          end.to change(User, :count).by(1)
             .and change(FamilyMembership, :count).by(1)

          expect(response).to have_http_status(:ok)

          new_user = User.find_by(email: invitation.email)
          expect(new_user).to be_present
          expect(new_user.name).to eq("New Invitee")
        end

        it "new user gets correct role from invitation" do
          teen_invitation = create(
            :invitation, family: family, inviter: admin_user, email: "teen@example.com", role: :teen
          )

          post "/api/v1/invitations/#{teen_invitation.token}/accept",
               params: { user: { name: "Teen User", password: "password123", password_confirmation: "password123" } }

          new_user = User.find_by(email: "teen@example.com")
          membership = FamilyMembership.find_by(user: new_user, family: family)
          expect(membership.role).to eq("teen")
        end
      end

      context "with invalid invitation" do
        it "returns 404 for invalid token" do
          post "/api/v1/invitations/invalid-token/accept"

          expect(response).to have_http_status(:not_found)
        end

        it "returns 410 for expired invitation" do
          expired_invitation = create(:invitation, :expired, family: family, inviter: admin_user)

          post "/api/v1/invitations/#{expired_invitation.token}/accept"

          expect(response).to have_http_status(:gone)
        end

        it "returns 410 for already accepted invitation" do
          accepted_invitation = create(:invitation, :accepted, family: family, inviter: admin_user)

          post "/api/v1/invitations/#{accepted_invitation.token}/accept"

          expect(response).to have_http_status(:gone)
        end
      end
    end

    describe "Step 5: Creating first goal after onboarding" do
      let(:user) { create(:user) }
      let(:family) { create(:family) }

      before do
        create(:family_membership, :admin, family: family, user: user)
      end

      it "creates first goal via POST /api/v1/families/:id/goals" do
        goal_params = {
          goal: {
            title: "My First Family Goal",
            time_scale: "weekly"
          }
        }

        expect do
          post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(user)
        end.to change(Goal, :count).by(1)

        expect(response).to have_http_status(:created)
        expect(response.parsed_body["goal"]["title"]).to eq("My First Family Goal")
      end

      it "returns is_first_goal flag for first goal" do
        goal_params = { goal: { title: "First Goal", time_scale: "weekly" } }

        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(user)

        expect(response.parsed_body["is_first_goal"]).to be true
      end

      it "tracks first_goal_created_at timestamp" do
        freeze_time do
          goal_params = { goal: { title: "First Goal", time_scale: "weekly" } }

          post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(user)

          expect(user.reload.first_goal_created_at).to be_within(1.second).of(Time.current)
        end
      end

      it "goal is associated with creator" do
        goal_params = { goal: { title: "Test Goal", time_scale: "weekly" } }

        post "/api/v1/families/#{family.id}/goals", params: goal_params, headers: auth_headers(user)

        goal = Goal.last
        expect(goal.creator).to eq(user)
        expect(goal.family).to eq(family)
      end
    end

    describe "Step 6: Tour preferences" do
      let(:user) { create(:user) }

      it "shows tour for new users via GET /api/v1/users/me/tour_preferences" do
        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["tour_preferences"]["should_show_tour"]).to be true
        expect(response.parsed_body["tour_preferences"]["tour_completed_at"]).to be_nil
      end

      it "marks tour as completed via POST /api/v1/users/me/tour_preferences/complete" do
        freeze_time do
          post "/api/v1/users/me/tour_preferences/complete", headers: auth_headers(user)

          expect(response).to have_http_status(:ok)
          expect(user.reload.tour_completed_at).to be_within(1.second).of(Time.current)
          expect(response.parsed_body["tour_preferences"]["should_show_tour"]).to be false
        end
      end

      it "can_restart_tour is true after completion" do
        user.update!(tour_completed_at: 1.day.ago)

        get "/api/v1/users/me/tour_preferences", headers: auth_headers(user)

        expect(response.parsed_body["tour_preferences"]["can_restart_tour"]).to be true
      end

      it "can dismiss tour temporarily via POST /api/v1/users/me/tour_preferences/dismiss" do
        post "/api/v1/users/me/tour_preferences/dismiss", headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(user.reload.tour_dismissed_at).to be_present
      end
    end
  end

  describe "End-to-end onboarding scenario" do
    # rubocop:disable RSpec/ExampleLength
    it "completes full onboarding flow from registration to first goal", :aggregate_failures do
      # Step 1: Register new user
      post "/api/v1/auth/register", params: {
        user: {
          email: "family_founder@example.com",
          name: "Family Founder",
          password: "password123",
          password_confirmation: "password123"
        }
      }
      expect(response).to have_http_status(:created)
      founder = User.find_by(email: "family_founder@example.com")

      # Step 2: Create family
      post "/api/v1/families",
           params: { family: { name: "Founders Family", timezone: "America/New_York" } },
           headers: auth_headers(founder)
      expect(response).to have_http_status(:created)
      family = Family.last
      expect(family.family_memberships.find_by(user: founder).admin?).to be true

      # Step 3: Invite family member
      post "/api/v1/families/#{family.id}/invitations",
           params: { invitation: { email: "spouse@example.com", role: "adult" } },
           headers: auth_headers(founder)
      expect(response).to have_http_status(:created)
      invitation = Invitation.last

      # Step 4: Spouse accepts invitation (new user registration)
      # Store the token before resetting - invitation may get reloaded/cleared
      invitation_token = invitation.token

      # Reset integration session to clear any logged in user
      reset!

      post "/api/v1/invitations/#{invitation_token}/accept",
           params: { user: { name: "Spouse Member", password: "password123", password_confirmation: "password123" } }
      expect(response).to have_http_status(:ok)
      spouse = User.find_by(email: "spouse@example.com")
      expect(FamilyMembership.find_by(user: spouse, family: family).role).to eq("adult")

      # Step 5: Founder creates first goal
      post "/api/v1/families/#{family.id}/goals",
           params: { goal: { title: "Plan family vacation", time_scale: "quarterly" } },
           headers: auth_headers(founder)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["is_first_goal"]).to be true

      # Step 6: Complete tour
      post "/api/v1/users/me/tour_preferences/complete", headers: auth_headers(founder)
      expect(response).to have_http_status(:ok)
      expect(founder.reload.tour_completed_at).to be_present

      # Verify final state
      expect(family.members.count).to eq(2)
      expect(family.goals.count).to eq(1)
    end
    # rubocop:enable RSpec/ExampleLength
  end
end
