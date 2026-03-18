import * as React from 'react';
import { ReactNode } from 'react';
import toast from 'react-hot-toast';
import {
  useCurrentUser,
  useIsUserDataLoaded,
} from '../../context/UserDataContext/UserDataContext';
import { supabase } from '../../lib/supabaseClient';
import { GroupData, isUserAdminOfGroup } from '../../models/groups/groups';
import { PostData } from '../../models/groups/posts';

const ActiveGroupContext = React.createContext<{
  activeGroupId: string;
  setActiveGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
  groupData?: GroupData;
  posts: PostData[];
  isLoading: boolean;
  showAdminView: boolean;
  setInStudentView: (inStudentView: boolean) => void;
  /**
   * Who to view the group as. Usually it's just currentUser.uid, but sometimes
   * (ie if parent wants to view child's progress, or if owner views member's progress)
   * it could be different
   */
  activeUserId: string | undefined;
  setActiveUserId: (id?: string) => void;
} | null>(null);

export function ActiveGroupProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();
  const isUserLoaded = useIsUserDataLoaded();
  const [activeGroupId, setActiveGroupId] = React.useState<string>('');
  const [posts, setPosts] = React.useState<PostData[]>([]);
  const [inStudentView, setInStudentView] = React.useState(false);
  const [activeUserId, setActiveUserId] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [groupData, setGroupData] = React.useState<GroupData>();

  React.useEffect(() => {
    // reset all Group states
    setGroupData(undefined);
    setPosts([]);
    setInStudentView(false);
    setActiveUserId(undefined);

    setIsLoading(true);
    if (!activeGroupId || !isUserLoaded) {
      return;
    }
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    let alive = true;

    const fetchGroup = async () => {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', activeGroupId)
        .maybeSingle();

      if (!alive) return;
      if (groupError) {
        toast.error(groupError.message);
        setGroupData(undefined);
      } else {
        setGroupData(
          group
            ? ({
                id: group.id,
                name: group.name,
                description: group.description,
                ownerIds: group.owner_ids ?? [],
                adminIds: group.admin_ids ?? [],
                memberIds: group.member_ids ?? [],
                postOrdering: group.post_ordering ?? [],
              } as GroupData)
            : undefined
        );
      }

      const { data: postsData, error: postsError } = await supabase
        .from('group_posts')
        .select('*')
        .eq('group_id', activeGroupId)
        .eq('is_deleted', false);

      if (!alive) return;
      if (postsError) {
        toast.error(postsError.message);
        setPosts([]);
      } else {
        setPosts(
          (postsData ?? []).map(post => ({
            id: post.id,
            name: post.name,
            timestamp: post.timestamp,
            body: post.body,
            isPinned: post.is_pinned,
            isPublished: post.is_published,
            isDeleted: post.is_deleted,
            type: post.type,
            pointsPerProblem: post.points_per_problem ?? {},
            problemOrdering: post.problem_ordering ?? [],
            ...(post.type === 'assignment'
              ? { dueTimestamp: post.due_at }
              : {}),
          })) as PostData[]
        );
      }

      setIsLoading(false);
    };

    fetchGroup();

    const groupChannel = supabase
      .channel(`group_${activeGroupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'groups', filter: `id=eq.${activeGroupId}` },
        () => fetchGroup()
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`group_posts_${activeGroupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_posts', filter: `group_id=eq.${activeGroupId}` },
        () => fetchGroup()
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(postsChannel);
    };
  }, [activeGroupId, currentUser?.uid, isUserLoaded]);

  const isUserAdmin = isUserAdminOfGroup(
    groupData,
    activeUserId ?? currentUser?.uid
  );
  return (
    <ActiveGroupContext.Provider
      value={{
        activeGroupId,
        setActiveGroupId,
        groupData,
        posts,
        isLoading,
        showAdminView: isUserAdmin && !inStudentView,
        setInStudentView: newVal => {
          setInStudentView(newVal);
          if (!newVal) setActiveUserId(undefined);
        },
        activeUserId: activeUserId ?? currentUser?.uid,
        setActiveUserId,
      }}
    >
      {children}
    </ActiveGroupContext.Provider>
  );
}

export function useActiveGroup() {
  const context = React.useContext(ActiveGroupContext);
  if (context === null) {
    throw 'useActiveGroup must be used within a ActiveGroupProvider';
  }
  return context;
}
