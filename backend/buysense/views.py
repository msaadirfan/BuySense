from django.shortcuts import render
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer, CustomerSerializer, SellerSerializer
from .models import Customer, Seller

User = get_user_model()


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class CreateCustomerView(generics.CreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically bind to the currently logged-in user
        user = self.request.user
        # Prevent duplicate customer profiles
        if Customer.objects.filter(user=user).exists():
            raise serializers.ValidationError("Customer profile already exists.")
        serializer.save(user=user)


class CreateSellerView(generics.CreateAPIView):
    queryset = Seller.objects.all()
    serializer_class = SellerSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if Seller.objects.filter(user=user).exists():
            raise serializers.ValidationError("Seller profile already exists.")
        serializer.save(user=user)