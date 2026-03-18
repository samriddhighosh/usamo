import { useCurrentUser } from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';
import { GroupData, JoinGroupLink } from '../../models/groups/groups';
import { useUserGroups } from './useUserGroups';

export function useGroupActions() {
  const currentUser = useCurrentUser();
  const { invalidateData } = useUserGroups();

  const updateGroup = async (
    groupId: string,
    updatedData: Partial<GroupData>
  ) => {
    const { id, ...data } = updatedData;
    const updatePayload: Record<string, any> = {
      name: data.name,
      description: data.description,
      owner_ids: data.ownerIds,
      admin_ids: data.adminIds,
      member_ids: data.memberIds,
      post_ordering: data.postOrdering,
    };
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined) delete updatePayload[key];
    });
    await supabase.from('groups').update(updatePayload).eq('id', groupId);
    invalidateData();
  };

  return {
    createNewGroup: async () => {
      if (!currentUser?.uid) {
        throw 'The user must be logged in to create a new group.';
      }

      const defaultGroup: Omit<GroupData, 'id'> = {
        name: 'New Group',
        description: '',
        ownerIds: [currentUser.uid],
        adminIds: [],
        memberIds: [],
        postOrdering: [],
      };
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: defaultGroup.name,
          description: defaultGroup.description,
          owner_ids: defaultGroup.ownerIds,
          admin_ids: defaultGroup.adminIds,
          member_ids: defaultGroup.memberIds,
          post_ordering: defaultGroup.postOrdering,
        })
        .select('id')
        .single();
      if (error) throw error;
      invalidateData();
      return data.id;
    },
    deleteGroup: async (groupId: string) => {
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      invalidateData();
    },
    updateGroup,
    leaveGroup: async (groupId: string, userId: string) => {
      const { data } = await supabase.rpc('groups_leave', {
        p_group_id: groupId,
      });
      const leaveResult = data as
        | { success: true }
        | { success: false; errorCode: string };
      // === typeguard check
      if (leaveResult.success === true) {
        invalidateData();
        return;
      }
      switch (leaveResult.errorCode) {
        case 'SOLE_OWNER':
          throw new Error(
            "Since you're the sole owner of this group, you are unable to leave. Try adding another owner or deleting the group instead."
          );
        case 'GROUP_NOT_FOUND':
          throw new Error('The group to be left could not be found');
        default:
          throw new Error('Error: ' + leaveResult.errorCode);
      }
    },
    createJoinLink: async (groupId: string): Promise<JoinGroupLink> => {
      const defaultJoinLink: Omit<JoinGroupLink, 'id'> = {
        groupId,
        revoked: false,
        numUses: 0,
        maxUses: null,
        expirationTime: null,
        usedBy: [],
        author: currentUser!.uid,
      };
      const { data, error } = await supabase
        .from('group_join_links')
        .insert({
          group_id: defaultJoinLink.groupId,
          revoked: defaultJoinLink.revoked,
          num_uses: defaultJoinLink.numUses,
          max_uses: defaultJoinLink.maxUses,
          expiration_time: defaultJoinLink.expirationTime,
          used_by: defaultJoinLink.usedBy,
          author: defaultJoinLink.author,
        })
        .select('*')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        groupId: data.group_id,
        revoked: data.revoked,
        numUses: data.num_uses,
        maxUses: data.max_uses,
        expirationTime: data.expiration_time,
        usedBy: data.used_by ?? [],
        author: data.author,
      };
    },
    updateJoinLink: async (
      id: string,
      linkData: Partial<JoinGroupLink>
    ): Promise<void> => {
      const { id: _, ...data } = linkData;
      await supabase
        .from('group_join_links')
        .update({
          group_id: data.groupId,
          revoked: data.revoked,
          num_uses: data.numUses,
          max_uses: data.maxUses,
          expiration_time: data.expirationTime,
          used_by: data.usedBy,
          author: data.author,
        })
        .eq('id', id);
    },
    updatePostOrdering: async (groupId: string, ordering: string[]) => {
      await supabase
        .from('groups')
        .update({ post_ordering: ordering })
        .eq('id', groupId);
    },
    removeMemberFromGroup: async (
      groupId: string,
      targetUid: string
    ): Promise<void> => {
      const { data } = await supabase.rpc('groups_remove_member', {
        p_group_id: groupId,
        p_target_uid: targetUid,
      });
      const removeResult = data as
        | { success: true }
        | { success: false; errorCode: string };
      if (removeResult.success === true) {
        invalidateData();
        return;
      }
      switch (removeResult.errorCode) {
        case 'REMOVING_SELF':
          throw new Error(
            'You cannot remove yourself from the group. Try leaving or deleting the group instead.'
          );
        case 'PERMISSION_DENIED':
          throw new Error('Only group owners can remove members.');
        case 'MEMBER_NOT_FOUND':
          throw new Error('The member to be removed could not be found.');
        case 'GROUP_NOT_FOUND':
          throw new Error('The group to be modified could not be found');
        default:
          throw new Error('Error: ' + removeResult.errorCode);
      }
    },
    updateMemberPermissions: async (
      groupId: string,
      targetUid: string,
      newPermissionLevel: 'OWNER' | 'ADMIN' | 'MEMBER'
    ): Promise<void> => {
      const { data } = await supabase.rpc('groups_update_member_permissions', {
        p_group_id: groupId,
        p_target_uid: targetUid,
        new_permission_level: newPermissionLevel,
      });
      const updateResult = data as
        | { success: true }
        | { success: false; errorCode: string };
      if (updateResult.success === true) {
        invalidateData();
        return;
      }
      switch (updateResult.errorCode) {
        case 'UPDATING_SELF':
          throw new Error('You cannot update your own permissions.');
        case 'PERMISSION_DENIED':
          throw new Error('Only group owners can remove members.');
        case 'ALREADY_NEW_PERMISSION_LEVEL':
          throw new Error(
            'The member to be updated is already that permission level!'
          );
        case 'MEMBER_NOT_FOUND':
          throw new Error('The member to be removed could not be found.');
        case 'INVALID_NEW_PERMISSION_LEVEL':
          throw new Error('An invalid new permission level was provided.');
        case 'GROUP_NOT_FOUND':
          throw new Error('The group to be modified could not be found');
        default:
          throw new Error('Error: ' + updateResult.errorCode);
      }
    },
  };
}
