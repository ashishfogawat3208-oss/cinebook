from rest_framework.permissions import BasePermission


class IsAdminUserOnly(BasePermission):
    """
    Allow access only to authenticated Django staff users.
    """

    message = "Administrator access is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )