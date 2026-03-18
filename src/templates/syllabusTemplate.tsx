import { graphql } from 'gatsby';
import * as React from 'react';
import SyllabusPage from '../components/syllabus/SyllabusPage';

export default function Template(props) {
  return (
    <SyllabusPage
      data={props.data}
      division={props.pageContext.division}
      path={props.path}
    />
  );
}
export const pageQuery = graphql`
  query Syllabus($division: String!) {
    modules: allXdm(
      filter: {
        fileAbsolutePath: { regex: "/content/" }
        fields: { division: { eq: $division } }
      }
    ) {
      nodes {
        id
        frontmatter {
          title
          id
          description
          frequency
        }
        isIncomplete
        cppOc
        javaOc
        pyOc
        fields {
          gitAuthorTime
        }
      }
    }
    problems: allProblemInfo(
      filter: { module: { fields: { division: { eq: $division } } } }
    ) {
      nodes {
        uniqueId
        name
        module {
          frontmatter {
            id
          }
        }
      }
    }
  }
`;
